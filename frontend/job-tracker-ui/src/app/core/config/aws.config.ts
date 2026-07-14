import { ResourcesConfig } from 'aws-amplify';

export const AWS_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_yYCMzYeEv',
      userPoolClientId: '40lpfhpaani64egiqq6slf0765',
      signUpVerificationMethod: 'code',
    },
  },
};
