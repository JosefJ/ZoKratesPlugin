ZoKrates Plugin for Remix IDE
==================================

This is work in progress!! 

Getting Started
---------------
Just run
`docker run -p 127.0.0.1:8080:8080 -ti zkplug:latest /bin/bash`
`cd ZoKratesPlugn`
`npm start`


Plugin definition
-----------------
When running locally:
```
{
"title": "ZoKrates",
"url": "http://127.0.0.1:8080"
}
```

Docker Support
--------------
Docker image will be available with next release. 
In the meantime just build it yourself from the dockerfile:
`docker build . -t zkplug -f ./Dockerfile `


License
-------
MIT
