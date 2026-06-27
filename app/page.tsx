import { Studio } from "@/components/Studio";
import { getOptionalUser } from "@/lib/auth0";

export default async function Home() {
  const user = await getOptionalUser();
  return <Studio user={user} />;
}
