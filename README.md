# Server Side Page Capture

## API

### POST `/capture`

🚨`Content-Type`: `application/json`

| Params         | Type     | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| urls           | string[] | **页面地址**<br />**必填**，最大长度 100。                   |
| viewportWidth  | number   | **浏览器窗口大小**<br />默认值：375。                        |
| viewportHeight | number   | 默认值：667<br />截取整个页面时，忽略该参数                  |
| selector       | string   | **截取指定元素**<br />传入的 `selector` 语法参照 `document.querySelector`。<br />不指定时，截取整个页面。 |
| imageFormat    | string   | **图片格式**<br />格式：`jpeg`  `png` `pdf`。默认值：`jpeg`。 |
| quality        | number   | **图片质量**<br />针对 `jpeg`<br />格式：0-100。默认值：80。 |
| responseFormat | string   | **返回的文件流格式**<br />格式： `zip`。                     |

#### Response

zip 格式的二进制流

截图文件将按页面在 `urls` 中的下标作为文件名，如 `0.jpeg` `1.jpeg` ...

#### Example

Requeset

```sh
curl -X "POST" "http://localhost:7980/capture" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "urls": [
    "https://baidu.com",
    "https://m.baidu.com"
  ]
}'
```

Response

```http
HTTP/1.1 200 OK
content-type: application/zip; charset=utf-8
content-disposition: attachment; filename="ibgGMj4hyoUropy3bpEEqV.zip"
content-length: 149611
Date: Thu, 15 Dec 2022 11:26:28 GMT
Connection: close

...
```

### GET `/capture-one`

用于请求单个 url，并直接返回图片文件流。请求参数参考 `/capture`。

#### Example

Request

```sh
// 可通过浏览器直接访问
http://localhost:8080/capture-one?url=http%3A%2F%2Fm.baidu.com
```

Response

```http
HTTP/1.1 200 OK
content-type: application/jpeg; charset=utf-8
content-disposition: attachment; filename="kP8EFQ7LhWCezqiXf2PtgT.jpeg"
content-length: 152239
Date: Mon, 19 Dec 2022 06:36:22 GMT
Connection: close

...
```



## Deploy

### Docker

1. [Install Docker](https://docs.docker.com/engine/install/) 
2. Run `sh docker-build.sh`
3. Run `sh docker-run.sh`
   - Default port `7980`

### Manual

- Node.js 16+
- [Install Chrome and fonts](https://pptr.dev/troubleshooting#chrome-headless-doesnt-launch-on-unix)
- Install Project Dependencies `yarn install --forzen-lock`
- Run `yarn start`
  - Default port `8080`
  - Use  `PORT` env variable to specify:  `PORT=6666 yarn start` 


## Development Guide

### Tech Stack

- [Fastify](https://www.fastify.io/)
- [Puppetter](https://pptr.dev/)
  - [Running in Docker](https://pptr.dev/troubleshooting/#running-puppeteer-in-docker)
  - [How to use Puppeteer inside a Docker container](https://dev.to/cloudx/how-to-use-puppeteer-inside-a-docker-container-568c)
- Docker Image
  - https://hub.docker.com/r/zenato/puppeteer
  - https://hub.docker.com/r/ghlx/puppeteer/tags


### For MacOS arm64

```sh
docker build --platform linux/arm64 -t $tag_name .
```

