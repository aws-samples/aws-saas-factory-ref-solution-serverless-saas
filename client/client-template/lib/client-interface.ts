import * as aws_s3 from "aws-cdk-lib/aws-s3";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import * as aws_cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cdk from "aws-cdk-lib";
import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export interface ClientInterfaceProps {
  directoryName: string;
  clientConfig: any;
}

export class ClientInterface extends Construct {

  public readonly s3Bucket: aws_s3.Bucket;
  public readonly webDistribution: aws_cloudfront.CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: ClientInterfaceProps) {
    super(scope, id);

    const createS3Bucket = (bucketName: string) => {
      bucketName += 'SiteBucket';
      const s3Bucket = new aws_s3.Bucket(this, bucketName, {
        encryption: aws_s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
      return s3Bucket;
    };

    const createCloudFrontWebDistribution = (id: string, s3Bucket: aws_s3.Bucket) => {
      const webDistribution = new aws_cloudfront.CloudFrontWebDistribution(
        this,
        "Site" + id,
        {
          originConfigs: [
            {
              s3OriginSource: {
                s3BucketSource: s3Bucket,
              },
              behaviors: [
                {
                  isDefaultBehavior: true,
                },
              ],
            },
          ],
          defaultRootObject: "index.html",
          httpVersion: aws_cloudfront.HttpVersion.HTTP2,
          priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_ALL,
          errorConfigurations: [
            {
              errorCode: 403,
              responseCode: 200,
              responsePagePath: "/index.html",
            },
            {
              errorCode: 404,
              responseCode: 200,
              responsePagePath: "/index.html",
            },
          ],
        }
      );

      const cfnOriginAccessControl = new aws_cloudfront.CfnOriginAccessControl(
        this,
        "OriginAccessControl" + id,
        {
          originAccessControlConfig: {
            name: `${id}-${this.node.id}`,
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
          },
        }
      );

      const cfnDistribution = webDistribution.node.defaultChild as CfnDistribution;
      cfnDistribution.addPropertyOverride(
        "DistributionConfig.Origins.0.OriginAccessControlId",
        cfnOriginAccessControl.getAtt("Id")
      );

      s3Bucket.addToResourcePolicy(
        new aws_iam.PolicyStatement({
          actions: ["s3:GetObject"],
          principals: [new aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
          effect: aws_iam.Effect.ALLOW,
          resources: [s3Bucket.bucketArn + "/*"],
          conditions: {
            StringEquals: {
              "AWS:SourceArn": cdk.Arn.format(
                {
                  service: "cloudfront",
                  resource: "distribution",
                  region: "", // must not specify a single region
                  resourceName: webDistribution.distributionId,
                },
                cdk.Stack.of(this)
              ),
            },
          },
        })
      );

      return webDistribution;
    };

    const callS3Deploy = (siteConfig: any, clientDirectoryName: string, s3Bucket: aws_s3.Bucket, webDistribution: aws_cloudfront.CloudFrontWebDistribution) => {
      const codeAssetDirectory = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'client',
        clientDirectoryName
      );

      const dockerImage = cdk.DockerImage.fromRegistry(
        'public.ecr.aws/docker/library/node:18.17.1-bookworm-slim'
      );

      new s3deploy.BucketDeployment(this, 'SiteCodeDeployment' + clientDirectoryName, {
        sources: [
          s3deploy.Source.asset(codeAssetDirectory, {
            assetHashType: cdk.AssetHashType.SOURCE,
            bundling: {
              image: dockerImage,
              entrypoint: ['bash', '-c'],
              user: 'root',
              bundlingFileAccess: cdk.BundlingFileAccess.VOLUME_COPY,
              command: [
                [
                  'pwd',
                  'yarn install',
                  `echo 'export const environment = ${JSON.stringify(
                    siteConfig
                  )}' > ./src/environments/environment.prod.ts`,
                  `echo 'export const environment = ${JSON.stringify(
                    siteConfig
                  )}' > ./src/environments/environment.ts`,
                  'npm run build',
                  'cp -r /asset-input/dist/* /asset-output/',
                ].join(' && '),
              ],
            },
          }),
        ],
        destinationBucket: s3Bucket,
        distribution: webDistribution, // invalidates distribution's edge caches
        prune: true,
      });
    };

    this.s3Bucket = createS3Bucket(id);
    this.webDistribution = createCloudFrontWebDistribution(id, this.s3Bucket);
    callS3Deploy(props.clientConfig, props.directoryName, this.s3Bucket, this.webDistribution);
  }
}
