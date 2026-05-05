const Sidebar = ({ theme }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-title">
          <span className="brand-primary">AI Reader</span>
          <br />
          <span className="brand-accent">Hub</span>
        </div>
        <div className="sidebar__brand-sub">Premium Archive</div>
      </div>

      <nav className="sidebar__nav">
        <button className="sidebar__link">
          <span className="material-symbols-outlined">home</span>
          Home
        </button>
        <button className="sidebar__link">
          <span className="material-symbols-outlined">library_books</span>
          Library
        </button>
        <button className="sidebar__link sidebar__link--active">
          <span className="material-symbols-outlined">description</span>
          Current PDF
        </button>
        <button className="sidebar__link">
          <span className="material-symbols-outlined">settings</span>
          Preferences
        </button>
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__divider">
          <button className="sidebar__link">
            <span className="material-symbols-outlined">person</span>
            Account
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
