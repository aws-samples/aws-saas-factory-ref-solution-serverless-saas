export class TenantConfig {
  constructor(config: any) {
    if(!Object.keys(config).length) return;
    this.idpDetails = config["idpDetails"];
    this.apiGatewayUrl = config["apiGatewayUrl"].replace(/\/$/, ''); // remove trailing slash (/) if present
  }
  idpDetails: any;
  apiGatewayUrl: string;
}
