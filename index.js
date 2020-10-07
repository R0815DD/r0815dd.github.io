//Initate plot with Google Charts API
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

//Label Button
const bigButton = document.getElementById('bigButton');
//Label Text
const batteryLevel = document.getElementById('Batterylevel');

// Initiate Variable
let constData = new Array([0,0]);
let counter = 0;
let timestamp = 0;
let volts = 0;

//Callback if Button clicked
bigButton.addEventListener('click', function(event) {
    connectBLE();
  });

  function connectBLE() //function to connect with peripheral
  {
    let serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; // define service UUID
    let characteristicUuid = '';
      navigator.bluetooth.requestDevice({//filter BLE peripheral with defined service UUID
        filters: [{
          services: [serviceUuid]
        }]
      })
      .then(device => device.gatt.connect()) //connect to peripheral
      //console.log("Connected");
      .then(server => {
        console.log('Getting Service...');
        return server.getPrimaryService(serviceUuid);
      })
      .then(service => {
        console.log('Getting Characteristics...');
        // Get all characteristics.
        return service.getCharacteristics();  //read all device Characteristics
      })
      .then(characteristics => {
        // Zuordnung UUIDs fest nach tatsächlicher UUID
          let batteryUuid = characteristics[1].uuid;  //create objects for sensor and battery characteristic
          let sensorUuid = characteristics[0].uuid;
          
          // setup notifications and event listerner for changed characteristic value
          batteryLevelCharacteristic = characteristics[1];
          batteryLevelCharacteristic.startNotifications();
          batteryLevelCharacteristic.addEventListener('characteristicvaluechanged',
            handleBatteryLevelChanged);
          sensorLevelCharacteristic = characteristics[0];
          sensorLevelCharacteristic.startNotifications();
          sensorLevelCharacteristic.addEventListener('characteristicvaluechanged',
            handleSensorValueChanged);
          console.log(batteryUuid + sensorUuid);
      })
    }
  
  function handleSensorValueChanged(event) { //fuction for changed sensor value
    let newData = event.target.value.getUint32(0, true);  //save value in newData 
    timestamp = newData >> 12;  //save timestamp
    volts = newData & 0x00000FFF;//save voltage from ecg value
    constData.push([timestamp , volts]); //save data in array
    counter++;

    if (constData.length >= 400)  // only collect last 400 values
    {
      constData.shift();
    }
    if (counter>50)  // update plot after 50 values
    {
      counter=0;
      drawChart();
    } 
  }
    
  //display battery state of charge
  function handleBatteryLevelChanged(event){
    let batteryLevel = event.target.value.getUint8(0);
    BatteryLevel.innerText = 'Battery Level: ' + batteryLevel + '%';
  }

  function drawChart() {  //update plot function
    var data = new google.visualization.DataTable();
      data.addColumn('number', 'time');
      data.addColumn('number', 'signal');    
      data.addRows(constData); 
      
    var options = {
      title: 'EKG',
      curveType: 'function',
      legend: { position: 'bottom' }
    };
    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    chart.draw(data, options); 
  }