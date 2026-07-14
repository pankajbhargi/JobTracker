import { bootstrapApplication } from '@angular/platform-browser';
import { Amplify } from 'aws-amplify';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { AWS_CONFIG } from './app/core/config/aws.config';

Amplify.configure(AWS_CONFIG);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
