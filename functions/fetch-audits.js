exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify([{ id: 1, site: "DVI1", status: "Complete" }]),
  };
};