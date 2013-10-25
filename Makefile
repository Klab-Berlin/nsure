test:
	./node_modules/.bin/mocha \
		--timeout 60000 \
		--reporter spec 

.PHONY: test