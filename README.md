ZoKrates Plugin for Remix IDE
==================================

This is work in progress!! 

Getting Started
---------------
Just run
`sudo docker run -p 127.0.0.1:8080:8080 -ti zkplug:latest /bin/bash`

`cd ZoKratesPlugn`
`npm start`


Plugin definition
-----------------

Trusted server:
```
{
"title": "ZoKrates",
"url": "https://zkplug.polynom.com"
}
```

When running locally:
```
{
"title": "ZoKrates",
"url": "http://127.0.0.1:8080"
}
```

Docker Support
--------------
TBD

Docker image available at: 


License
-------

MIT



HLP: sudo docker run -p 127.0.0.1:8080:8080 -ti -v ~/WebstormProjects/ZoKratesPlugin:/home/zokrates/plugin zkplug:latest /bin/bash
sudo docker build . -t zkplug -f ./Dockerfile 
