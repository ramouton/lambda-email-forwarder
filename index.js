exports.handler = (event, context, callback) => {

  if (event.keepalive) {
    callback(null,{"alive":true});
  }

  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  var ses = new AWS.SES();

  var simpleParser = require('mailparser').simpleParser;
  
  var inbound_email_s3_bucket = process.env.INBOUND_EMAIL_BUCKET;
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
      simpleParser(data.Body, (err, mail)=>{
        if (err) {
          console.log(err);
          callback('simpleParser error',null);
        } else {
          console.log(mail);
          callback(null,{"success":true});
        }
      });
    }
  });


/*
  var email_sender = event.Records[0].ses.mail.source;
  var email_subject = event.Records[0].ses.mail.commonHeaders.subject;
  var email_date = event.Records[0].ses.mail.commonHeaders.date;
  console.log(email_sender,email_date,email_subject);
*/

};
