# Server Side Page Capture

## API

### POST `/capture`

🚨`Content-Type`: `application/json`

| Params         | Type     | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| urls           | string[] | **页面地址**<br />**必填**，最大长度 100。                   |
| viewportSize   | string   | **浏览器窗口大小**<br />格式：`{width}x{height}`。默认值：375x667。 |
| selector       | string   | **截取指定元素**<br />传入的 `selector` 语法参照 `document.querySelector`。<br />不指定 _或_ 指定元素不存在时，截取整个页面。 |
| imageFormat    | string   | **图片格式**<br />格式：`jpeg` _或_ `png`。默认值：`jpeg。`  |
| quality        | number   | **图片质量**<br />针对 `jpeg`<br />格式：0-100。默认值：80。 |
| responseFormat | string   | **返回的打包格式**<br />格式： `zip`。                       |

#### 文件命名

页面截图文件，将按页面在 `urls`中的下标作为文件名。如 `1.jpeg` `2.jpeg`

 



