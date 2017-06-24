exports.handler = (event, context, callback) => {
  var AWS = require('aws-sdk');
  
  var email_sender = event.Records[0].ses.mail.source;
  var email_subject = event.Records[0].ses.mail.commonHeaders.subject;
  var email_date = event.Records[0].ses.mail.commonHeaders.date;
  
  var email_message_id = event.Records[0].ses.mail.messageId;

  console.log('Need to put in AWS SES send mail call');
  
  console.log(email_message_id);
  console.log(email_sender,email_date,email_subject);
  
  callback(null,{"success":true});
};
