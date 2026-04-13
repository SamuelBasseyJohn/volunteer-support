import VolunteerChatView from "~/views/components/VolunteerChatView";

const ChatPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  return <VolunteerChatView id={id} />;
};

export default ChatPage;
