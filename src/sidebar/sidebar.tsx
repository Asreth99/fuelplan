import { useState } from 'react';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import './sidebar.css';
import AutocompleteForm from '../googleMap/autocompleteForm';
import Calculator from '../calculator/calculator';

type sidebarProps = {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  directions: google.maps.DirectionsResult | null;
  onSubmit: () => void;
  
}


function SideBarLayout({ origin, setOrigin, destination, setDestination, directions, onSubmit }: sidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{display: 'flex', flexDirection: 'row', height: '100vh'}}>
       <Sidebar className='sidebar' collapsed={collapsed} width='30vh'>
        <Menu >
          <MenuItem onClick={() => setCollapsed(!collapsed)}>Dashboard</MenuItem>
              <SubMenu label="Search" >
                <h1>Search</h1>
                <AutocompleteForm
                  origin={origin}
                  setOrigin={setOrigin}
                  destination={destination}
                  setDestination={setDestination}
                  onSubmit={onSubmit}
                />
              </SubMenu>
              <SubMenu label="Calculator" >
                <Calculator
                  directions={directions}
                />
              </SubMenu>
        </Menu>
      </Sidebar>
    </div>
  );
}
export default SideBarLayout;