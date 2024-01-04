import React, { useEffect, useState } from 'react';
import './App.css';

interface EquipmentData {
  id: string;
  state: string;
}

interface States {
  [id: string]: string;
}

const URI = "http://localhost:4000/api/";

const convertEquipmentData = (data: EquipmentData[]) => {
  return data.reduce((equipments: States, equipmentData: EquipmentData) => ({...equipments, [equipmentData.id]: equipmentData.state }), {});
}

const updateEquipmentData = (prevEquipments: EquipmentData[], data: EquipmentData) => {
  const equipments: EquipmentData[] = structuredClone(prevEquipments);
  const equipmentIndex = equipments.findIndex(equipment => data.id === equipment.id);
  equipments[equipmentIndex] = data;
  return equipments;
}

function App() {
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [states, setStates] = useState<States>({});
  useEffect(() => {
    const getData = () => {
      fetch(`${URI}equipments`)
      .then((response) => response.json())
      .then((data) => { setEquipmentData(data); setStates(convertEquipmentData(data)) })
      .catch((error) => console.log(error));
    };

    getData();

    const eventSource = new EventSource(`${URI}realtimeState`);
    eventSource.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setEquipmentData((prevState) => {
        return updateEquipmentData(prevState, data);
      });

      setStates((prevState) => {
        return {...prevState, [data.id]: data.state}
      });

    }
    return () => {
      eventSource.close();
    };
  }, []);

  const handleChange = (equipmentId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setStates({...states, [equipmentId]: event.target.value });
  }

  const handleClick = (equipmentId: string) => () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: equipmentId, state: states[equipmentId] })
    };

    fetch(`${URI}changeState`, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== 'OK') console.log(data.status);
      })
      .catch((error) => console.log(error));
  }

  return (
    <div className="App">
      <table>
        <thead>
          <tr>
            <th>Equipment</th>
            <th>State</th>
            <th>Change state</th>
          </tr>
        </thead>
        <tbody>
          {
            equipmentData.map(({id, state}: EquipmentData) => (
              <tr key={id}>
                <td>{id}</td>
                <td>{state}</td>
                <td>
                  <input type="radio" id={`red${id}`} name={`state${id}`} value="red" checked={states[id] === 'red'} onChange={handleChange(id)} />
                  <label htmlFor={`red${id}`}>Red</label>
                  <input type="radio" id={`yellow${id}`} name={`state${id}`} value="yellow" checked={states[id] === 'yellow'} onChange={handleChange(id)} />
                  <label htmlFor={`yellow${id}`}>Yellow</label>
                  <input type="radio" id={`green${id}`} name={`state${id}`} value="green" checked={states[id] === 'green'} onChange={handleChange(id)} />
                  <label htmlFor={`green${id}`}>Green</label>
                  <button onClick={handleClick(id)}>Change</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default App;
