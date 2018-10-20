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

        MashupPlatform.operator.log(
            "CKAN server: " + this.ckanserver, MashupPlatform.log.INFO);
        MashupPlatform.operator.log(
            "Resource ID: " + this.resourceid, MashupPlatform.log.INFO);
        MashupPlatform.operator.log(
            "CKAN token: " + this.ckantoken, MashupPlatform.log.INFO);

        getCkanMetadata(this.ckanserver, this.resourceid, this.ckantoken).then(
            processCkanMetadata,
            function (reason) {
                MashupPlatform.operator.log(
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
            MashupPlatform.http.makeRequest(new URL('api/action/resource_show?id=' + resourceid, ckanserver), {
                method: "GET",
                supportsAccessControl: true,
                requestHeaders: getAuthHeader(ckantoken),
                forceProxy: true,
                onSuccess: function (response) {
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
                var url = new URL(response.result.url);
                if (url.pathname.startsWith('/v2')) { // V1 of NGSI API is not supported (POST params)
                    var metadata = {};
                    var types_par = getURLParameter('type', url);
                    var attrs_par = getURLParameter('attrs', url);
                    var options_par = getURLParameter('options', url);
                    metadata.types = types_par ? types_par.split(',') : null;
                    metadata.filteredAttributes = attrs_par ? attrs_par.split(',') : null;
                    metadata.filteredAttributes.concat(response.result.attrs_str);
                    // metadata.entity = response.result.entity; // For future support of fiware-ngsi-registry
                    metadata.auth_type = response.result.auth_type;
                    metadata.idPattern = getURLParameter('idPattern', url);
                    metadata.query = getURLParameter('q', url);
                    metadata.values = options_par ? options_par.split(',').includes('values') : false;
                    metadata.serverURL = url.protocol + '//' + url.host;
                    metadata.servicePath = response.result.service_path;
                    metadata.tenant = response.result.tenant;
                    MashupPlatform.wiring.pushEvent('ngsimetadata', metadata);
                } else {
                    MashupPlatform.operator.log(
                        "Only NGSI version 2 is supported", MashupPlatform.log.ERROR);
                }
            }
        }
    }

    window.CKANMetadata = CKANMetadata;

    var ckanMetadata = new CKANMetadata();
    window.addEventListener("DOMContentLoaded", ckanMetadata.init.bind(ckanMetadata), false);

})();
