import { useState } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Separator } from "@chakra-ui/react";
import "./sidebar.css";
import AutocompleteForm from "../googleMap/autocompleteForm";
import Calculator from "../calculator/calculator";

type sidebarProps = {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  directions: google.maps.DirectionsResult | null;
  onSubmit: () => void;
};

function SideBarLayout({
  origin,
  setOrigin,
  destination,
  setDestination,
  directions,
  onSubmit,
}: sidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
      <Sidebar className="sidebar" collapsed={collapsed} width="35vh">
        <Menu>
          <MenuItem
            onClick={() => setCollapsed(!collapsed)}
            icon={<span className="material-symbols-outlined">menu</span>}
          />
          <Separator borderColor="gray.200" width="100vh" size={"md"} />
          <br />

          <SubMenu
            label="Search"
            icon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, verticalAlign: "middle" }}
              >
                search
              </span>
            }
          >
            <AutocompleteForm
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              onSubmit={onSubmit}
            />
          </SubMenu>

          <SubMenu
            label="Calculator"
            icon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, verticalAlign: "middle" }}
              >
                calculate
              </span>
            }
          >
            <Calculator directions={directions} />
          </SubMenu>
        </Menu>
      </Sidebar>
    </div>
  );
}
export default SideBarLayout;
