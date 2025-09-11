# GiftyV2 Cloud Service Configuration (AWS Free Tier)

This document outlines the basic cloud services configured for GiftyV2, adhering to the AWS "always free" tier limits as per the `CloudProviderSelection.md` rationale.

## Configured Services:

### 1. AWS CLI Installation and Configuration
*   **Action:** The AWS Command Line Interface (CLI) was installed on the local machine.
*   **Details:** Installation was performed by downloading the `AWSCLIV2.pkg` and executing `sudo installer -pkg AWSCLIV2.pkg -target /`.
*   **Credentials:** AWS CLI was configured with the provided Access Key ID and Secret Access Key. The default region was set to `eu-central-1` (Europe/Frankfurt), and the default output format to `json`.

### 2. AWS Lambda Function
*   **Service:** AWS Lambda (Serverless Compute)
*   **Action:** A basic "Hello World" Lambda function was created.
*   **Location:** The function code is located at `lambda/hello-world/index.js`.
*   **Free Tier Relevance:** AWS Lambda offers 1 million free requests per month and 400,000 GB-seconds of compute time per month, suitable for initial development.

### 3. Amazon S3 Bucket
*   **Service:** Amazon S3 (Object Storage)
*   **Action:** An S3 bucket was created for static assets and general object storage.
*   **Name:** The bucket name follows the pattern `giftyv2-static-assets-` followed by a timestamp (e.g., `giftyv2-static-assets-1757601536`).
*   **Region:** `eu-central-1`.
*   **Free Tier Relevance:** Amazon S3 provides 5 GB of standard storage, 20,000 Get Requests, and 2,000 Put Requests per month in the free tier.

### 4. Amazon DynamoDB Table
*   **Service:** Amazon DynamoDB (NoSQL Database)
*   **Action:** A DynamoDB table was created for application data.
*   **Name:** `GiftyV2Users`.
*   **Primary Key:** `UserId` (String type).
*   **Provisioned Throughput:** 5 ReadCapacityUnits and 5 WriteCapacityUnits.
*   **Region:** `eu-central-1`.
*   **Free Tier Relevance:** DynamoDB offers 25 GB of storage, 25 units of write capacity, and 25 units of read capacity per month, sufficient for up to 200 million requests per month within the free tier.

### 5. AWS Budgets for Usage Monitoring
*   **Service:** AWS Budgets (Cost Management)
*   **Action:** A budget was set up to monitor and control costs.
*   **Name:** `GiftyV2FreeTierBudget`.
*   **Limit:** $0.01 USD per month.
*   **Scope:** Monitors costs associated with resources tagged `Project:GiftyV2`.
*   **Notification:** An email alert will be sent to `badbeats87@gmail.com` if the actual monthly cost exceeds 80% of the $0.01 budget limit.
*   **Free Tier Relevance:** AWS Budgets itself has a free tier for the first 20,000 budget entities, ensuring cost-effective monitoring.

### 6. Virtual Private Cloud (VPC) Configuration
*   **Service:** Amazon VPC (Virtual Private Cloud)
*   **Action:** A new VPC, subnets, Internet Gateway, and route tables were created for network isolation.
*   **Details:**
    *   **VPC ID:** `vpc-07712525d0c550d22`
    *   **Public Subnets:**
        *   `subnet-06e3887caf21db509` (eu-central-1a)
        *   `subnet-0d5815648cc02fa0e` (eu-central-1b)
    *   **Private Subnets:**
        *   `subnet-00e6566d730252e6e` (eu-central-1a)
        *   `subnet-03fe81dded91b0dfe` (eu-central-1b)
    *   **Internet Gateway ID:** `igw-0333fbd895a312e12`
    *   **Public Route Table ID:** `rtb-084505bd4b016447e`
    *   **Private Route Table ID:** `rtb-038b5ea0b03336d6d`
    *   **Security Groups:**
        *   `GiftyV2-Web-SG` (`sg-0fb95576f551ac3a1`)
        *   `GiftyV2-App-SG` (`sg-0542c23e0c3c00395`)
        *   `GiftyV2-DB-SG` (`sg-004b47bfb0e2fe027`)
*   **Free Tier Relevance:** VPC itself does not incur charges, but associated resources like NAT Gateways do. This configuration avoids NAT Gateways to stay within the free tier.

### 7. Subnet Allocation for Application Components
*   **Action:** Defined subnet usage for different application components based on the GiftyV2 microservices architecture.
*   **Details:**
    *   **Public Subnets (`subnet-06e3887caf21db509`, `subnet-0d5815648cc02fa0e`):**
        *   **Components:** Application Load Balancer (ALB) or API Gateway, public-facing web servers (if applicable).
        *   **Rationale:** These components require direct internet access to serve user requests.
    *   **Private Subnets (`subnet-00e6566d730252e6e`, `subnet-03fe81dded91b0dfe`):**
        *   **Components:** Backend Microservices (e.g., ECS/EKS Fargate, EC2 instances), AWS Lambda Functions (when accessing VPC resources), other internal services.
        *   **Rationale:** These components should not be directly exposed to the internet for enhanced security. They receive traffic from public-facing components (ALB/API Gateway) and communicate with internal resources like DynamoDB.
*   **Security Group Application:**
    *   `GiftyV2-Web-SG`: Associated with ALB/API Gateway in public subnets (inbound HTTP/HTTPS).
    *   `GiftyV2-App-SG`: Associated with backend microservices in private subnets (inbound from `GiftyV2-Web-SG`, outbound to `GiftyV2-DB-SG`).
    *   `GiftyV2-DB-SG`: Applied to network interfaces of backend microservices and Lambda functions for secure communication with DynamoDB.
*   **Free Tier Relevance:** This allocation strategy leverages existing VPC resources and prioritizes serverless/managed services to remain within the AWS free tier.

### 8. Security Group Rules Configuration
*   **Action:** Configured ingress and egress rules for the GiftyV2 security groups.
*   **Details:**
    *   **`GiftyV2-Web-SG` (`sg-0fb95576f551ac3a1`):**
        *   **Ingress (Inbound):**
            *   HTTP (Port 80) from `0.0.0.0/0`
            *   HTTPS (Port 443) from `0.0.0.0/0`
        *   **Egress (Outbound):**
            *   TCP (Port 8080) to `GiftyV2-App-SG` (`sg-0542c23e0c3c00395`)
    *   **`GiftyV2-App-SG` (`sg-0542c23e0c3c00395`):**
        *   **Ingress (Inbound):**
            *   TCP (Port 8080) from `GiftyV2-Web-SG` (`sg-0fb95576f551ac3a1`)
        *   **Egress (Outbound):**
            *   TCP (Port 443) to `GiftyV2-DB-SG` (`sg-004b47bfb0e2fe027`)
            *   TCP (Port 443) to `0.0.0.0/0` (for general internet access)
    *   **`GiftyV2-DB-SG` (`sg-004b47bfb0e2fe027`):**
        *   **Ingress (Inbound):**
            *   TCP (Port 443) from `GiftyV2-App-SG` (`sg-0542c23e0c3c00395`)
        *   **Egress (Outbound):**
            *   No specific outbound rules.
