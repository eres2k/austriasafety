exports.handler = async (event) => {
  const template = JSON.parse(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Template saved", template }),
  };
};