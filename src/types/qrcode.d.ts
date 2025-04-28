declare module 'qrcode' {
  const toDataURL: (text: string, options?: any) => Promise<string>;
  export { toDataURL };
  export default { toDataURL };
}
