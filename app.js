//////////////////// Imports

// Import Express framework to build our API server
import express from 'express';

// Import Axios to make HTTP requests to external APIs
import axios from 'axios';


// Import JWT library to handle user authentication tokens
import jwt from 'jsonwebtoken';

////////////////////

// Create the application to handle and route webservices
const app = express();

// Middleware to parse JSON 
app.use(express.json());

// Set the app port to 3000 or a random port
const port = process.env.PORT || 3000;

// fetch the configured environement variables
const sfClientId = process.env.SF_CLIENT_ID;
const sfUsername = process.env.SF_USERNAME;
const sfTokenUrl = process.env.SF_TOKEN_URL;
const sfTokenAud = process.env.SF_TOKEN_AUD;
const jwtPrivateKey = process.env.JWT_PRIVATE;
const verifyToken = process.env.VERIFY_TOKEN;


// Start the webservice
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});

////////////////////  Webhook functions

// Route for GET requests
// This function is used to verify the webhook from the third party
app.get('/', (req, res) => {

  //this part of the code purely specific depending on the third party
  //the variables that are being sent in the payload, in this example we took 
  //verfiy_token as the only variable that needs to be validated like in the case of Meta' API
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {

    console.log('WEBHOOK VERIFIED');

    // return the status "200" - the webhook is verified
    res.status(200).send(challenge);

  } else {

    // return the status "403"
    res.status(403).end();
  }
});


// Route for POST requests
// The function that is called as the callback url everytime by the third party
app.post('/', async(req, res) => {

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // log important information : timestamp and incoming paylaod
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).end();

  
  // Call the Salesforce Authorization server to get a token
  const token = await getSalesforceToken();

  // if the operation is succesful, make the final API call or code manipulation before
  if (token) {

    // Custom Code
    //
    //

    callYourCustomSalesforceAPI();
  }
  else {

    // Custom Code
    //
    //

  }
});


//////////////////// 

//////////////////// Utlity functions

// Function that calls the Salesforce Authorization server to get a token
async function getSalesforceToken() {
  
  try {

    // generate the assertion token from JWT and private key
    const assertionToken = getAssertionToken();

    const response = await axios.post(
      sfTokenUrl,
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: assertionToken
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    console.log("Salesforce Access Token:", response.data.access_token);
    return response.data.access_token;

  } catch (error) {
    console.error('Error getting Salesforce token:', error.response?.data || error.message);
    return null;
  }
}



function getAssertionToken() {

    // Build the JWT payload
    const payload = {aud: sfTokenAud,iss: sfClientId,sub: sfUsername,exp: Math.floor(Date.now() / 1000) + 180 };

    // Sign the JWT witth the private key
    const assertion = jwt.sign(payload, jwtPrivateKey, { algorithm: 'RS256' });

    return assertion;
}

// your custom function
async function callYourCustomSalesforceAPI() {

  try {
    
    var sfInstanceUrl = 'your salesforce URL';

    // API call with a bearer token
    const response = await axios.post(
      `${sfInstanceUrl}/services/..../`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Apex response:", response.data);

    return response.data;
    
  } catch (err) {
    
    console.error("Error calling Apex endpoint:", err.response?.data || err.message);
    throw err;
  }

  ////////////////////
}