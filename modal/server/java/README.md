# Name of sample

## Requirements

- Maven
- Java
- [Configured .env file](../README.md)

1. Build the jar

```
mvn package
```

2. Run the packaged jar

```
java -cp target/sample-jar-with-dependencies.jar com.stripe.sample.Server
```

3. Go to `localhost:4242` in your browser to see the demo
