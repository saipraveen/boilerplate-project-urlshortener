require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
// const dns = require('node:dns');
const { nanoid } = require('nanoid');
const mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

// Mongo schema
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const urlSchema = new mongoose.Schema({
  urlId: { type: String, required: true },
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true }
});
const Url = mongoose.model('Url', urlSchema);

// Helper function
const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', urlencodedParser, (req, res) => {
  const originalUrl = req.body.url;
  const base = req.baseUrl;
  if(!isValidUrl(originalUrl))
    return res.json({"error": "invalid url"});

  console.log('valid url');
  let urlData;
  
  Url.findOne({originalUrl: originalUrl})
    .then(data => 
      {
        urlData = data;
        if(urlData)
            return res.json(
              {"original_url": urlData.originalUrl, "short_url": urlData.urlId});

        const urlId = nanoid(5);
        const shortUrl = `${base}/${urlId}`;
        url = new Url({
          urlId: urlId,
          originalUrl: originalUrl,
          shortUrl: shortUrl
        });
        url.save()
          .then(savedData => {
            return res.json(
              {"original_url": savedData.originalUrl, "short_url": savedData.urlId});
          });
      })
    .catch(err => console.error(err));
  
  // res.redirect(307, "api/shorturl");
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const urlId = req.params.short_url;
  Url.findOne({urlId: urlId})
  .then(data => 
    {
      console.log(data);
      if(!data)
        return res.json({"error": "invalid url"});
      res.redirect(307, data.originalUrl);
    })
  .catch(err => console.error(err));
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
