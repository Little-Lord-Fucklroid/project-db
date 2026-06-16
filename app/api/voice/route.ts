export async function POST() {
  return Response.json(
    {
      error: "Voice API is not currently used. The app uses browser speech synthesis.",
    },
    {
      status: 501,
    }
  );
}