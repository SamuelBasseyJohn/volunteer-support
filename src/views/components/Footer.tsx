/**
 * VIEW LAYER — Footer Component
 *
 * Site-wide footer displayed on every page via the root layout.
 */
const Footer = () => {
  return (
    <footer style={{ margin: "0", padding: "0.5rem", backgroundColor: "#f5f3f3" }}>
      <p className="bg-[#F5F3F3] p-1 text-center text-base text-[#2093D6]">
        &copy; 2026 Group 25. All rights reserved.
      </p>
      <p className="bg-[#F5F3F3] p-1 text-center text-base text-[#2093D6]">
        Our mission: To support and connect volunteers worldwide.
      </p>
    </footer>
  );
};

export default Footer;
