import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KubectlV32Layer } from '@aws-cdk/lambda-layer-kubectl-v32';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';


export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'IsolatedVPC', {
      maxAzs: 2, // Number of Availability Zones
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    // find existing vpc

    // const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
    //   vpcId: 'vpc-xxxxxxxx' // Replace VPC ID
    // });


    const eksSecurityGroup = new ec2.SecurityGroup(this, 'EksClusterSG', {
      vpc,
      description: 'Allow access to EKS cluster',
      allowAllOutbound: true
    });

    eksSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.15.4.11/32'),  
      ec2.Port.tcp(443),  
      'Allow on-prem node CIDR range'
    );

    eksSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.15.4.12/32'),  
      ec2.Port.tcp(443),  
      'Allow on-prem pod CIDR range'
    );

    eksSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.15.4.13/32'),  
      ec2.Port.tcp(443),  
      'Allow on-prem pod CIDR range'
    );

    new ec2.InterfaceVpcEndpoint(this, 'EcrVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'EcrDockerVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });


    new ec2.InterfaceVpcEndpoint(this, 'CwVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'CwLogsVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'StSLogsVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.STS,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'SsmLogsVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'SsmMessagesLogsVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'LambdaVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'EKSVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EKS, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'EC2VpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'EC2MessagesVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'StepFVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.STEP_FUNCTIONS, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });

    new ec2.InterfaceVpcEndpoint(this, 'StepFSyncVpcEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.STEP_FUNCTIONS_SYNC, 
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: vpc.availabilityZones, 
      },
      securityGroups: [eksSecurityGroup], 
    });
    
    new ec2.GatewayVpcEndpoint(this, 'S3VpcEndpoint', {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3, // S3 service
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, 
        },
      ],
    });


    const cluster = new eks.Cluster(this, 'obs', {
      version: eks.KubernetesVersion.V1_32,
      kubectlLayer: new KubectlV32Layer(this, 'kubectl'),
      clusterName: "obs-test",
      securityGroup: eksSecurityGroup, 
      placeClusterHandlerInVpc: true,
      endpointAccess: eks.EndpointAccess.PRIVATE,
      defaultCapacity: 0, // prevent CDK from creating default worker nodes
      clusterHandlerEnvironment: {
        AWS_STS_REGIONAL_ENDPOINTS: 'regional',
      },
      kubectlEnvironment: {
        AWS_STS_REGIONAL_ENDPOINTS: 'regional',
      },
      vpc,
      authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
      //to deploy cluster in private subnets<
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, 
        },
      ],
      remoteNodeNetworks: [
        {cidrs: ["10.15.4.11/32", "10.15.4.12/32", "10.15.4.13/32"]} //On-prem node cidr range, must for hybrid nodes
      ],
    });

    // add sso roles here
    const ssoRoles = [
      'arn:aws:iam::xxx:role/xxx',
      'arn:aws:iam::xxx:role/xxx'
    ];

    ssoRoles.forEach((roleArn, index) => {
      cluster.awsAuth.addRoleMapping(
        iam.Role.fromRoleArn(this, `SsoRole${index}`, roleArn),
        {
          groups: ['system:masters'], // Grants full admin access
        }
      );
    });




  // System setup
    // cluster.addHelmChart('metrics-server', {
    //   repository: 'https://kubernetes-sigs.github.io/metrics-server/',
    //   chart: 'metrics-server',
    //   version: '3.12.2',
    //   namespace: 'kube-system',
    //   release: 'metrics-server',
    // });

    // cluster.addHelmChart('cilium', {
    //   chart: 'cilium',
    //   repository: 'https://helm.cilium.io/',
    //   release: 'cilium',
    //   version: '1.17.2',
    //   namespace: 'kube-system',
    //   values: {
    //     'cni': { 'exclusive': true },
    //     'ipam': { 'mode': 'cluster-pool' },
    //     'bpf': { 'masquerade': true },
    //     'nodePort': {'enabled': true},
    //     'clusterPoolIPv4PodCIDRList': ["10.20.0.0/16"] //change CIDR
    //     // 'routingMode': 'native',
    //     // 'ipv4NativeRoutingCIDR': "10.11.0.0/16",
    //   }
    // });

    // new eks.Addon(this, 'ebs-csi', {
    //   cluster,
    //   addonName: 'aws-ebs-csi-driver',
    // });
  }
}
