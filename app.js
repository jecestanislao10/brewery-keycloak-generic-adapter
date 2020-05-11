const express = require('express');
const http = require('http');
const request = require('request');
const app = express();

let token = {};

app.use('/logout', (req, res) => {
  const logout_token = token.access_token;
  token = {};
  res.redirect(`http://localhost:8080/auth/realms/stratpoint/protocol/openid-connect/logout?id_token_hint=${logout_token}&post_logout_redirect_uri=http://localhost:3000/secured&state=aSh9Ohqu`)
})

app.use('/secured', (req, response) => {
    request(
        {
          method: 'GET',
          uri: 'http://localhost:3000/authenticate',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '+ token.access_token
          },
        },
        (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
        try {
          const resp = JSON.parse(body);
              response.json({
                message: 'youve reached a secured resource. you are authenticated',
                body: resp,
                token
              });
        } catch(err){
          response.redirect('http://localhost:3000/authenticate');
        }
      });
    // response.json('Reached secured endpoint');
})

app.use('/callback', (req, response, next) => {

    request(
        {
          method: 'POST',
          uri: 'http://localhost:8080/auth/realms/stratpoint/protocol/openid-connect/token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: {
            client_id: 'the-brewery',
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/callback',
            code: req.query.code
          }
        },
        (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
        if (res.statusCode === 200) {
          token = JSON.parse(body);
          response.redirect('/secured');
        }else{
          response.status(400).json(body)
        }
        }
      )
})
app.get('/authenticate', (req, response, next) => {
    request(
        {
          method: 'GET',
          uri: 'http://localhost:8080/auth/realms/stratpoint/protocol/openid-connect/userinfo',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '+ token.access_token
          },
        },
        (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
        if (res.statusCode === 200) {
            response.json(JSON.parse(body));
        }else{
            response.redirect('http://localhost:8080/auth/realms/stratpoint/protocol/openid-connect/auth?response_type=code&client_id=the-brewery&redirect_uri=http://localhost:3000/callback&nonce=n-0S6_WzA2Mj&state=bsfksns');
        }
        }
      )
})

const server = app.listen(process.env.PORT || 3000, () => {
    console.log('Server listening on PORT: ', server.address().port);
});