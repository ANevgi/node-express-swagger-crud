const express = require("express");
const app = express();
import bodyParser from 'body-parser';
import { initialize, handler }  from './asdagpt.js';

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

//  POST call - Means you are adding new user into database 

app.post("/initialize", (req, res) => {

  // Error handling
  if (!req.body.userID) {
    return res.status(400).send({
      success: "false",
      message: "userID is required",
    });
  } else if (!req.body.conversationID) {
    return res.status(400).send({
      success: "false",
      message: "conversationID is required",
    });
  }

  initialize(req, res);
})

app.post("/conversation", (req, res) => {

  // Error handling
  if (!req.body.prompt) {
    return res.status(400).send({
      success: "false",
      message: "prompt is required",
    });
  } else if (!req.body.userID) {
    return res.status(400).send({
      success: "false",
      message: "userID is required",
    });
  } else if (!req.body.conversationID) {
    return res.status(400).send({
      success: "false",
      message: "conversationID is required",
    });
  }

  handler(req, res);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(22, () => {
  console.log("server listening on port 22!");
});
