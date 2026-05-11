package com.xoxoisme.mindkeyword;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(exclude = {
		UserDetailsServiceAutoConfiguration.class
})
@EnableJpaAuditing
public class MindkeywordApplication {

	public static void main(String[] args) {
		SpringApplication.run(MindkeywordApplication.class, args);
	}

}
