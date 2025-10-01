// src/aws-config.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  }
});

export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = "excelfastDB";