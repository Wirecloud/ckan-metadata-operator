# CKAN metadata operator operator

The CKAN metadata operator operator is a WireCloud operator that receives, in an HTTP call to it's containing dashboard, the ID of a resource and the CKAN server containing it, and works on that resource ID to get metadata from that resource on the CKAN server.

This operator is intended to serve as entry point for special dashboards that serve for guided creation of data visualization dashboards, and checks specifically NGSI resources (`fiware-ngsi` CKAN type defined by [FIWARE CKAN Extensions](https://github.com/conwetlab/FIWARE-CKAN-Extensions)).

## Build dependencies

Be sure to have installed [Node.js](https://nodejs.org/) in your system. For example, you can install it on Ubuntu and Debian running the following commands:

```bash
sudo apt update; sudo apt install curl gnupg
curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
sudo apt install nodejs npm 
```

You also have to install the [Grunt](https://gruntjs.com/)'s command line interface (CLI):

```sudo npm install -g grunt-cli
```

The remaining dependencies are installed using npm (you have to run this command
inside the folder where you downloaded this repository):

```bash
npm install
```


## Build

Once installed all the build dependencies you can build this operator by using grunt:

```bash
grunt
```

If everything goes well, you will find a wgt file in the `dist` folder.


## Documentation

Documentation about how to use this operator is available on the
[User Guide](src/doc/userguide.md). Anyway, you can find general information
about how to use operators on the
[WireCloud's User Guide](https://wirecloud.readthedocs.io/en/stable/user_guide/)
available on Read the Docs.

## Copyright and License

Copyright (c) 2018 CoNWeT Lab., Universidad Politécnica de Madrid
Licensed under the MIT license.
