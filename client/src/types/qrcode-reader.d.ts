declare module 'qrcode-reader' {
  export default class QrReader {
    callback: (error: Error | null, result: { result: string } | null) => void;
    decode: (imageData: ImageData) => void;
  }
}