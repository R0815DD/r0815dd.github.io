//Initialisere Plot mit Google Charts API
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

//Label Button
const bigButton = document.getElementById('bigButton');
const batteryLevel = document.getElementById('Batterylevel');

// Initialisiere Variable
let constData = new Array([0,0]);
let counter = 0;
let timestamp = 0;
let volts = 0;

//Callback wenn Button geklickt wird
bigButton.addEventListener('click', function(event) {
    connectBLE();
  });

  function connectBLE() //Funktion zur Vernindung mit BLE Device
  {
    let serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
    let characteristicUuid = '';
      console.log("Button pressed"); //Debug Ausgabe wenn Funktion aufgerufen
      navigator.bluetooth.requestDevice({//Filter BLE Geräte, nur Gerät mit korrekter Service UUID wird gefunden
        filters: [{
          services: [serviceUuid]
        }]
      })
      .then(device => device.gatt.connect())
      //console.log("Connected");
      .then(server => {
        console.log('Getting Service...');
        return server.getPrimaryService(serviceUuid);
      })
      .then(service => {
        console.log('Getting Characteristics...');
        // Get all characteristics.
        return service.getCharacteristics();
      })
      .then(characteristics => {
          let batteryUuid = characteristics[1].uuid;
          let sensorUuid = characteristics[0].uuid;
          
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
 
    
      
      function handleSensorValueChanged(event) { //Funktion wenn Charakteristik Wert geändert
        let newData = event.target.value.getUint32(0, true);  //speichert neuen Wert in newData 
        //let millis = Date.now() - start;
        //console.log((millis/1000) + "  " + newData);
        timestamp = newData >> 12;  //Zeitstempel, aktuell 5 ms Zykluszeit
        volts = newData & 0x00000FFF;
        constData.push([timestamp , volts]); //speichert Zeitstempel und Wert in Ringspeicher
        counter++;
        

        if (constData.length >= 400)  // Nur die letzten 400 Werte werden gespeichert, ältere Werte gelöscht
        {
          constData.shift();
        }
        if (counter>50)  // aktualisiert Plot alle 50 Werte
        {
          counter=0;
          drawChart();
        }
        
      }
      
      function handleBatteryLevelChanged(event){
        let batteryLevel = event.target.value.getUint8(0);
        BatteryLevel.innerText = 'Battery Level: ' + batteryLevel + '%';
        // console.log('> Battery Level is ' + batteryLevel + '%');
      }

  function drawChart() {  //Funktion zeichnet Plot
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
    chart.draw(data, options); //Zur Optimierung, diese Zeile möglichst allein ausführen
  }

  


