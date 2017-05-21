const express = require('express');
const Document = require('../../models/document_models');
const watermarker = require('../watermark_service');

const documentRouter = express.Router();

documentRouter.route('/watermark/:documentType/:topic')
  .post((req, res) => {

    const document = new Document({
      title: req.body.title,
      author: req.body.author
    });

    if (!req.body.title && !req.body.author) {
      res.status(400);
      res.send('Title and author are required');
    }
    else {
      document.save((err) => {
        if (err) console.log(err);
      });
      res.status(201);
      res.send({ ticket: document._id });

      // Save the created watermark to the existing DB record
      return new Promise((resolve, reject) => {
        resolve(watermarker(req.params, req.body));        
      }).then(watermark => {
        Document.findById(document._id)
        .then(document => {
          document.watermark = watermark;
          document.save()
          .catch(err => new Error('Failed to save the watermark to DB', err));
        })
      })
      .catch(err => new Error('Failed to create the watermark', err));
    }
  });

documentRouter.route('/status/:documentId')
  .get((req, res) => {
    Document.findById(req.params.documentId, (err, document) => {
      if (err) {
        res.status(500).send(err);
      }
      else if (document) {
        res.json(document);
      }
      else {
        res.status(404).send('No document found');
      }
    });
  });

module.exports = documentRouter;