import EventManagement from "~/views/components/ManageEvent";

const Manage = async({params}: {params: Promise<{id: string}>}) => {
  const id = (await params).id
  return <EventManagement id={id}/>
}

export default Manage;
