//Initialisere Plot mit Google Charts API
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

//Label Button
const bigButton = document.getElementById('bigButton');


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
      console.log("Button pressed"); //Debug Ausgabe wenn Funktion aufgerufen
      navigator.bluetooth.requestDevice({//Filter BLE Geräte, nur Gerät mit korrekter Service UUID wird gefunden
        filters: [{
          services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
        }]
      })
      .then(device => device.gatt.connect())
      //console.log("Connected");
      .then(server => {
        // Getting ECG Service...
        console.log("connected");
        return server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      })
      
      .then(service => {
        // Getting ECG Level Characteristic...
        console.log("Server");
        return service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
      })
      .then(characteristic => characteristic.startNotifications())//BLE Charakteristik nutz Notify Funktion, wird hier aktiviert
      .then(characteristic => {
        // Set up event listener for when characteristic value changes.
        characteristic.addEventListener('characteristicvaluechanged', //Callback wenn sich Wert der Charakteristik ändert
          handleCharacteristicValueChanged);
          console.log('Notifications have been started.');
      })
      .then(device => {
        // Set up event listener for when device gets disconnected.
        device.addEventListener('gattserverdisconnected', onDisconnected);
      
        // Attempts to connect to remote GATT Server.
        return device.gatt.connect();
      })
      .then(server => { /* ... */ })
      .catch(error => { console.log(error); });
      
      
      function handleCharacteristicValueChanged(event) { //Funktion wenn Charakteristik Wert geändert
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

  (function () {
    var old = console.log;
    var logger = document.getElementById('log');
    console.log = function () {
      for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] == 'object') {
            logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<br />';
        } else {
            logger.innerHTML += arguments[i] + '<br />';
        }
      }
    }
})();


