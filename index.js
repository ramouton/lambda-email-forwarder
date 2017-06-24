exports.handler = (event, context, callback) => {
  var inbound_args = {};
  inbound_args.event = event;
  inbound_args.context = context;
  console.log(inbound_args);
  callback(null,inbound_args);
};
