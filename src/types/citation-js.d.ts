declare module "citation-js" {
  export class Cite {
    constructor(data?: any, options?: any);
    format(format: string, options?: any): string;
    get(options?: any): any;
    add(data: any): this;
    static async(data: any, options?: any): Promise<Cite>;
  }
  export default Cite;
}
