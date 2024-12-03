# TaskLister deployable with Kubernetes!
This is for the "Build Something" assignment in the course "PA2577 H24 lp2 Tillämpad Cloud Computing och Big Data.".
## Deploy and test the program
1. Run the following commands:
```
make conf
```
and
```
make kub
```
These make commands will run the following commands:
```
kubectl create configmap mysql-init --from-file=init.sql
kubectl apply -f Kubernetes/v1-mysql.yaml
kubectl apply -f Kubernetes/v1-TLApp.yaml
kubectl apply -f Kubernetes/v1-uservice.yaml
```
2. Now try to access [uservice](http://localhost:4000) and add a user.
- If you were unable to access the application through step you should run the following commands:
kubectl port-forward service/tlapp-service 3000:3000
kubectl port-forward service/uservice-service 4000:4000
- Now go back to step 2.
3. You can now see this user at [users](http://localhost:4000/users). Take notice of user_id as you will need it in the next step.
4. The user_id is incremented and so i know that you saw the user_id as '1' if you added a user. Now go to [tlapp](http://localhost:3000).
5. Try adding a task with a invalid user_id. 
6. Now try adding a task with a valid user_id (presumably user_id 1 if you added a user).
7. Go to [tasks](http://localhost:3000/Tasks) to see your added task.

-----------------------------------------------------------------------------

1. TLApp Communicating with uservice:
    * TLApp is responsible for managing tasks, and each task is assigned to a user. To fetch if a user exists TLApp sends a REST API request to uservice.
    * uservice confirms or denies that a user exists.

Example Scenario:
* TLApp fetches a task with a user_id.
* TLApp sends a GET request to uservice to fetch information about the user associated with that user_id.

* TLApp (Task Management) → Makes HTTP requests to uservice (User Management).
    * TLApp is the client, initiating REST API calls to uservice to fetch user data.
    * uservice is the server, responding to TLApp's requests with user details.
-----------------------------------------------------------------------------
* Task Service (TLApp/src/index.js):
    * REST endpoints: GET /tasks, POST /tasks, PUT /tasks/:id, DELETE /tasks/:id.
    * Connect to the database for persistent storage.
* User Service (uservice/src/index.js):
    * REST endpoints: GET /users, POST /users.
    * Connect to the same database but operate on a different table (users).
*   Database Service:
    * MySQL will be deployed as a standalone service in Kubernetes with a persistent volume.

Kubernetes Deployment
* YAML files for each deployment:
    * v1-TLApp.yaml: Deployment and Service for the Task Service.
    * v1-uservice.yaml: Deployment and Service for the User Service.
    * v1-mysql.yaml: Deployment, Service, and PersistentVolumeClaim for MySQL.

useful links:
https://kubernetes.io/docs/tutorials/stateful-application/mysql-wordpress-persistent-volume/
