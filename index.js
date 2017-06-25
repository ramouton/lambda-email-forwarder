exports.handler = (event, context, callback) => {

  if (event.keepalive) {
    console.log('still alive');
    callback(null,{"alive":true});
  }

  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  var ses = new AWS.SES();

  var simpleParser = require('mailparser').simpleParser;
  
  var inbound_email_s3_bucket = process.env.INBOUND_EMAIL_BUCKET;
  var outbound_source_address = process.env.SOURCE_EMAIL_ADDRESS;
  var outbound_forward_to_address = process.env.FORWARD_TO_EMAIL_ADDRESS;
  
  var email_message_id = null;
  if (event.Records) {
    email_message_id = event.Records[0].ses.mail.messageId;
  } else {
    callback('Invalid SES Call',null);
  }

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
                  Data: 'Fwd: '+ inbound_email.subject + ' <' + inbound_email.from.value[0].address + '>' 
                }
              }, 
              ReplyToAddresses: [inbound_email.from.value[0].address], 
              ReturnPath: outbound_source_address,
              Source: outbound_source_address 
            };
            if (inbound_email.html === false) {
              delete outbound_email_params.Message.Body.Html;
            }
            ses.sendEmail(outbound_email_params, function(err, outbound_email) {
              if (err) {
                console.log(err, err.stack);
              } else {
                s3.deleteObject(s3_read_params, function(err, kp_data) { 
                  if (err) {
                    console.log(err, err.stack);
                    callback('s3 error',null);
                  } else {
                    console.log('Email Successfully processed');
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
