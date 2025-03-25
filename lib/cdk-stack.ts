import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KubectlV32Layer } from '@aws-cdk/lambda-layer-kubectl-v32';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';


export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const vpc = new ec2.Vpc(this, 'EKS-VPC', { maxAzs: 2 }); //to create vpc


    // find existing vpc
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: 'vpc-xxxxxxxx' // Replace VPC ID
    });

    const eksSecurityGroup = new ec2.SecurityGroup(this, 'EksClusterSG', {
      vpc,
      description: 'Allow access to EKS cluster',
      allowAllOutbound: true
    });

    eksSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('x.x.x.x/24'),  
      ec2.Port.tcp(443),  
      'Allow on-prem node CIDR range'
    );

    eksSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('x.x.x.x/24'),  
      ec2.Port.tcp(443),  
      'Allow on-prem pod CIDR range'
    );

    const cluster = new eks.Cluster(this, 'obs', {
      version: eks.KubernetesVersion.V1_32,
      kubectlLayer: new KubectlV32Layer(this, 'kubectl'),
      clusterName: "obs-test",
      securityGroup: eksSecurityGroup, 
      defaultCapacity: 0, // prevent CDK from creating default worker nodes 
      vpc,

      //to deploy cluster in private subnets
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, 
        },
      ],
      remoteNodeNetworks: [
        {cidrs: ["x.x.x.x/24"]} //On-prem node cidr range, must for hybrid nodes
      ],
      remotePodNetworks: [
        {cidrs: ["x.x.x.x/24"]} //On-prem pod cidr range
      ]
    });


    // add sso roles here
    const ssoRoles = [
      'arn:aws:iam::<ACC ID>:role/AWSReservedSSO_AdministratorAccess_596e9bb8690dba1d',
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

    cluster.addHelmChart('cilium', {
      chart: 'cilium',
      repository: 'https://helm.cilium.io/',
      release: 'cilium',
      version: '1.17.2',
      namespace: 'kube-system',
      values: {
        'cni': { 'exclusive': true },
        'ipam': { 'mode': 'cluster-pool' },
        'bpf': { 'masquerade': true },
        'nodePort': {'enabled': true},
        'clusterPoolIPv4PodCIDRList': ["10.20.0.0/16"] //change CIDR
        // 'routingMode': 'native',
        // 'ipv4NativeRoutingCIDR': "10.11.0.0/16",
      }
    });

    // new eks.Addon(this, 'ebs-csi', {
    //   cluster,
    //   addonName: 'aws-ebs-csi-driver',
    // });
  }
}
