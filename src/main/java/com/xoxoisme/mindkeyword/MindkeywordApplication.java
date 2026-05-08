package com.xoxoisme.mindkeyword;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MindkeywordApplication {

	public static void main(String[] args) {
		SpringApplication.run(MindkeywordApplication.class, args);
	}

}
