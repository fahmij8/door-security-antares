#include <AntaresESP32MQTT.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <ArduinoJson.h>
Servo myservo;

#define ACCESSKEY "9634da50ff7abd7a:3bdb608765b907a4"
#define projectName "SmartDoorSecurity"
#define WIFISSID ""
#define PASSWORD ""

#define deviceMqttSub "esp32"
#define deviceMqttPub "reedswitch"
#define deviceMqttPub2 "esp32-status"

int sequence = 0;

int redLampPin = 25;
int greenLampPin = 26; 
int blueLampPin = 27;
int buzzerPin = 13; // Relay
int lockPin = 4; // Relay
int reedPin = 12;
int servoOnePin = 32;

int lampState = 0;
int buzzerState = 0;
int lockState = 0;
int reedState = 0;
int servoState = 0;

int posServo = 0;
int servoFinish = 0;
int prevReed = 2;

TaskHandle_t toggleLEDHandler;
TaskHandle_t toggleBuzzerHandler;
TaskHandle_t toggleLockHandler;
TaskHandle_t stayAliveHandler;

AntaresESP32MQTT antares(ACCESSKEY);

void callback(char topic[], byte payload[], unsigned int length) {
  antares.get(topic, payload, length);
  StaticJsonBuffer<256> jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(antares.getPayload());

  if(!root.containsKey("reed")){
    lampState = antares.getInt("lamp");
    buzzerState = antares.getInt("buzzer");
    lockState = antares.getInt("lock");
    servoState = antares.getInt("servo");
  }
}

void setup() {
  Serial.begin(115200);
  antares.setDebug(true);
  Serial.print("Connecting to ");
  Serial.println(WIFISSID);

  WiFi.begin(WIFISSID, PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected.");
  
  antares.setMqttServer();
  antares.setCallback(callback);
  
  // sets the pins as outputs:
  pinMode(redLampPin, OUTPUT);
  pinMode(greenLampPin, OUTPUT);
  pinMode(blueLampPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(lockPin, OUTPUT);
  pinMode(reedPin, INPUT);
  
  // initiate lamp off
  digitalWrite(redLampPin, HIGH);
  digitalWrite(greenLampPin, HIGH);
  digitalWrite(blueLampPin, HIGH);
  digitalWrite(buzzerPin, LOW);
  digitalWrite(lockPin, HIGH);
  digitalWrite(reedPin, LOW);

  xTaskCreatePinnedToCore(
    toggleLED,   /* Task function. */
    "Toggle LED",     /* name of task. */
    2048,       /* Stack size of task */
    NULL,        /* parameter of the task */
    1,           /* priority of the task */
    &toggleLEDHandler,      /* Task handle to keep track of created task */
    0);          /* pin task to core 0 */     
  xTaskCreatePinnedToCore(
    toggleBuzzer,   /* Task function. */
    "Toggle Buzzer",     /* name of task. */
    2048,       /* Stack size of task */
    NULL,        /* parameter of the task */
    1,           /* priority of the task */
    &toggleBuzzerHandler,      /* Task handle to keep track of created task */
    0);
  xTaskCreatePinnedToCore(
    toggleLock,   /* Task function. */
    "Toggle Lock",     /* name of task. */
    2048,       /* Stack size of task */
    NULL,        /* parameter of the task */
    1,           /* priority of the task */
    &toggleLockHandler,      /* Task handle to keep track of created task */
    1);
  xTaskCreatePinnedToCore(
    stayAlive,   /* Task function. */
    "Stay Alive",     /* name of task. */
    2048,       /* Stack size of task */
    NULL,        /* parameter of the task */
    3,           /* priority of the task */
    &stayAliveHandler,      /* Task handle to keep track of created task */
    1);
}

void toggleLED(void * parameter){
  for(;;){ // infinite loop
    if(lampState == 1){
      Serial.println("[!] Turning on LED");
      digitalWrite(redLampPin, LOW);
      digitalWrite(greenLampPin, HIGH);
      digitalWrite(blueLampPin, HIGH);
      delay(100);
      digitalWrite(redLampPin, HIGH);
      digitalWrite(greenLampPin, LOW);
      digitalWrite(blueLampPin, HIGH);
      delay(100);
      digitalWrite(redLampPin, HIGH);
      digitalWrite(greenLampPin, HIGH);
      digitalWrite(blueLampPin, LOW);
    } else {
      Serial.println("[!] Turning off LED");
      digitalWrite(redLampPin, HIGH);
      digitalWrite(greenLampPin, HIGH);
      digitalWrite(blueLampPin, HIGH);
    }

    // Pause the task again for 500ms
    vTaskDelay(300 / portTICK_PERIOD_MS);
  }
}

void toggleBuzzer(void * parameter){
  for(;;){ // infinite loop
    if(buzzerState == 1){
      Serial.println("[!] Turning on Buzzer");
      digitalWrite(buzzerPin, HIGH);
    } else {
      Serial.println("[!] Turning off Buzzer");
      digitalWrite(buzzerPin, LOW);
    }

    // Pause the task again for 500ms
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}

void toggleLock(void * parameter){
  for(;;){ // infinite loop
    if(lockState == 1){
      Serial.println("[!] Turning on Lock");
      digitalWrite(lockPin, HIGH);
    } else {
      Serial.println("[!] Turning off Lock");
      digitalWrite(lockPin, LOW);
    }

    // Pause the task again for 500ms
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }
}

void stayAlive(void * parameter){
  for(;;){ // infinite loop
    Serial.println("[!] Adding stay alive status");
    sequence = sequence + 1;
    antares.add("sequence", sequence);
    antares.publish(projectName, deviceMqttPub2);
    
    // Pause the task again for 500ms
    vTaskDelay(50000 / portTICK_PERIOD_MS);
  }
}

void loop() {
  antares.checkMqttConnection();
  reedState = digitalRead(reedPin);
  // Servo Mechanism
  if(servoState == 0 && servoFinish == 0) {
    myservo.attach(servoOnePin);
    for(posServo = 180; posServo >= 0; posServo -= 1){
      myservo.write(posServo);
      delay(5);
      Serial.println(posServo);
    }
    servoFinish = 1;
    myservo.detach();
  } else if (servoState == 1 && servoFinish == 0){
    myservo.attach(servoOnePin);
    for(posServo = 0; posServo <= 180; posServo += 1){
      myservo.write(posServo);
      delay(5);
      Serial.println(posServo);
    }
    servoFinish = 1;
    myservo.detach();
  }
  // Reed switch mechanism
  if(prevReed == 2){
    prevReed = reedState;
    antares.add("reed", reedState);
    antares.publish(projectName, deviceMqttPub);
  } else {
    if(prevReed != reedState){
      antares.add("reed", reedState);
      antares.publish(projectName, deviceMqttPub);
      prevReed = reedState;
    }
  }
}
