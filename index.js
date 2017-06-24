exports.handler = (event, context, callback) => {
  var arguments = {};
  arguments.event = event;
  arguments.context = context;
  console.log(arguments);
  callback(null,arguments);
};
