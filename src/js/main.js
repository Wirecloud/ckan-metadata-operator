/*
 * ckan-metadata
 * https://github.com/Wirecloud/ckan-metadata-operator
 *
 * Copyright (c) 2018 CoNWeT Lab., Universidad Politécnica de Madrid
 * Licensed under the MIT license.
 */

(function () {

    "use strict";

    var CKANMetadata = function CKANMetadata() {
        this.ckanserver = null;
        this.resourceid = null;
        this.ckantoken = null;
    }

    CKANMetadata.prototype.init = function init() {
        var mashupUrl = window.frameElement.parentNode.ownerDocument.location;
        this.ckanserver = getURLParameter('ckanserver', mashupUrl);
        this.resourceid = getURLParameter('resourceid', mashupUrl);
        this.ckantoken = getURLParameter('ckantoken', mashupUrl);
        getCkanMetadata(this.ckanserver, this.resourceid, this.ckantoken).then(
            processCkanMetadata,
            function (reason) {
                MashupPlatform.widget.log(
                    "Could not get CKAN metadata. " + reason,
                    MashupPlatform.log.ERROR);
            });
    };

    var getURLParameter = function getURLParameter(name, url) {
        var value;

        if (url.search !== '') {
            // Remove the initial "?" char
            url.search.substr(1).split("&").some(function (paramdef) {
                var parts = paramdef.split("=", 2);
                var paramname = decodeURIComponent(parts[0]);
                if (paramname === name) {
                    if (parts.length === 2) {
                        value = decodeURIComponent(parts[1]);
                    } else {
                        value = "";
                    }
                    return true;
                }
            });
            return value;
        } else {
            return null;
        }
    };


    var getCkanMetadata = function getCkanMetadata(ckanserver, resourceid, ckantoken) {
        return new Promise(function (resolve, reject) {
            MashupPlatform.http.makeRequest(new URL('api/action/resource_show', ckanserver), {
                method: "GET",
                supportsAccessControl: true,
                requestHeaders: getAuthHeader(ckantoken),
                onSucess: function (response) {
                    resolve(JSON.parse(response.responseText));
                },
                onFailure: function (response) {
                    reject(response);
                }
            });
        });
    }

    var getAuthHeader = function getAuthHeader(ckantoken) {
        var header;

        if (ckantoken !== '') {
            header = {
                'Authorization': ckantoken
            };
        } else if (MashupPlatform.context.get('fiware_token_available')) {
            header = {
                'X-FIWARE-OAuth-Token': 'true',
                'X-FIWARE-OAuth-Header-Name': 'X-Auth-Token'
            };
        }
        return header;
    }

    var processCkanMetadata = function processCkanMetadata(response) {
        if (response.success) {
            if (response.result.format !== 'fiware-ngsi') { // Regular CKAN data -> DataStore
                if (MashupPlatform.operator.outputs.ckansource.connected) {
                    MashupPlatform.wiring.pushEvent('ckansource', {
                        ckanserver: this.ckanserver,
                        resourceid: this.resourceid
                    });
                }
            } else if (MashupPlatform.operator.outputs.ngsimetadata.connected) {
                // Process NGSI entities and proceed with NGSI dashboard creation
                var url = document.createElement('a');
                if (url.pathname.startsWith('/v2')) { // V1 of NGSI API is not supported (POST params)
                    url.href = response.result.url;
                    var metadata = { // TODO Support ../entities/{id}/attrs/{attr_name}[/value] syntax
                        types: getURLParameter('type', url).split(','),
                        filteredAttributes: getURLParameter('attrs', url).split(','),
                        values: getURLParameter('options', url).split(',').includes('values'),
                        serverURL: url.protocol + '//' + url.host
                    };
                    MashupPlatform.wiring.pushEvent('ngsimetadata', metadata);
                } else {
                    MashupPlatform.widget.log(
                        "Only NGSI version 2 is supported", MashupPlatform.log.ERROR);
                }
            }
        }
    }

    window.CKANMetadata = CKANMetadata;

    var ckanMetadata = new CKANMetadata();
    window.addEventListener("DOMContentLoaded", ckanMetadata.init.bind(ckanMetadata), false);

})();