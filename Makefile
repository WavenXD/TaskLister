
conf:
	kubectl create configmap mysql-init --from-file=init.sql
	
kub:
	kubectl apply -f Kubernetes/v1-mysql.yaml
	kubectl apply -f Kubernetes/v1-TLApp.yaml
	kubectl apply -f Kubernetes/v1-uservice.yaml
