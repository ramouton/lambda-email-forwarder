exports.handler = (event, context, callback) => {

  if (event.keepalive) {
    callback(null,{"alive":true});
  }

  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  var ses = new AWS.SES();

  var simpleParser = require('mailparser').simpleParser;
  
  var inbound_email_s3_bucket = process.env.INBOUND_EMAIL_BUCKET;
  var outbound_source_address = process.env.SOURCE_EMAIL_ADDRESS;
  var outbound_forward_to_address = process.env.FORWARD_TO_EMAIL_ADDRESS;
  
  var email_message_id = event.Records[0].ses.mail.messageId;

  var s3_read_params = {
    Bucket: inbound_email_s3_bucket,
    Key: email_message_id
  };
  s3.getObject(s3_read_params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback('s3 error',null);
    } else {
      simpleParser(data.Body, (err, inbound_email)=>{
        if (err) {
          console.log(err);
          callback('simpleParser error',null);
        } else {
          if (inbound_email.attachments.length == 0) {
            if (inbound_email.html === false) {
              inbound_email.html = inbound_email.text;
            }
            var outbound_email_params = {
              Destination: {
                BccAddresses: [], 
                CcAddresses: [], 
                ToAddresses: [outbound_forward_to_address]
              }, 
              Message: {
                Body: {
                  Html: {
                    Charset: "UTF-8", 
                    Data: inbound_email.html 
                  }, 
                  Text: {
                    Charset: "UTF-8", 
                    Data: inbound_email.text 
                  }
                }, 
                Subject: {
                  Charset: "UTF-8", 
                  Data: inbound_email.subject 
                }
              }, 
              ReplyToAddresses: [inbound_email.from.value[0].address], 
              Source: outbound_source_address 
            };
            ses.sendEmail(outbound_email_params, function(err, outbound_email) {
              if (err) {
                console.log(err, err.stack);
              } else {
                s3.deleteObject(params, function(err, kp_data) { 
                  if (err) {
                    console.log(err, err.stack);
                    callback('s3 error',null);
                  } else {
                    callback(null,{"success":true});
                  }
                });
              }
            });
          } else {
            console.log('Emails with attachments not yet supported');
            callback('Emails with attachments not yet supported',null);
          }
        }
      });
    }
  });

};
