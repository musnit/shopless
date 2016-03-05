#Serverless Starter

A boilerplate for new Serverless Projects.  This is full of useful examples and we add more on a regular basis.

##Install

Make sure you have the [Serverless Framework](http://www.serverless.com) installed and you're using Node V4
```
npm install serverless -g
```

Go into the restApi component and install its dependencies via npm:
```
npm install
```

Add your aws keys to a file admin.env in the repo folder:
SERVERLESS_ADMIN_AWS_ACCESS_KEY_ID=asdfg
SERVERLESS_ADMIN_AWS_SECRET_ACCESS_KEY=asdf

Add your serverless env config to a .env file in the repo folder:
SERVERLESS_STAGE=dev
SERVERLESS_DATA_MODEL_STAGE=dev
SERVERLESS_PROJECT_NAME=serverless-starter

Deploy your functions and endpoints:
```
serverless dash deploy
```

##Includes

This project contains the following:

* **Single:** A single function that does all we need.
* **Optimizer Plugin:**  Each function is automatically optimized via the [serverless-optimizer-plugin](https://www.github.com/serverless/serverless-optimizer-plugin)
* **Templates:** Templates are used to reduce configuraton syntax
* **REST API Parameters:** The Multi/Show function endpoint gives an example of how to accept a path parameter
