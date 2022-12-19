export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>

export type CaptureBaseType = {
  viewportWidth: number
  viewportHeight: number
  selector?: string
  imageFormat?: 'png' | 'jpeg'
  quality?: number
  responseFormat?: 'zip'
}

export type CaptureRequestBodyType = CaptureBaseType & {
  urls: string[]
}

export type CaptureRequestQuerystringType = CaptureBaseType & {
  url: string
}

export type CaptureOptions = RequiredField<
  CaptureRequestBodyType,
  | 'viewportWidth'
  | 'viewportHeight'
  | 'imageFormat'
  | 'quality'
  | 'responseFormat'
>

export type CaptureTask = {
  taskId: string
  jobs: CaptureTaskJob[]
  options: CaptureOptions
}

export type CaptureTaskJob = {
  url: string
  index: number
  status: 'pending' | 'done' | 'error'
  file?: string
  error?: Error
}
