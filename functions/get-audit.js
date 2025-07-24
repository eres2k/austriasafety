exports.handler = async (event) => {
  const { id } = event.queryStringParameters;
  return {
    statusCode: 200,
    body: JSON.stringify({ id, site: "DVI1", checklist: [] }),
  };
};