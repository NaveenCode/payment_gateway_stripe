import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Button,
} from "@react-email/components";

interface EmailTemplateProps {
  firstName: string;
  lastName?: string;
  email?: string;
  message?: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  footerText?: string;
}

export function EmailTemplate({
  firstName,
  lastName = "",
  email = "",
  message = "Thank you for signing up. We're excited to have you on board!",
  actionUrl = "",
  actionText = "Get Started",
  companyName = "Acme",
  footerText = "If you have any questions, feel free to reach out to us.",
}: EmailTemplateProps) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#f6f9fc",
          fontFamily: "Arial, sans-serif",
          padding: "20px 0",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            padding: "40px 20px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          {/* Header */}
          <Heading
            style={{
              color: "#333",
              fontSize: "24px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Welcome, {fullName}!
          </Heading>

          <Hr style={{ borderColor: "#e0e0e0", margin: "20px 0" }} />

          {/* Main Content */}
          <Section style={{ marginTop: "20px" }}>
            <Text
              style={{ color: "#666", fontSize: "16px", lineHeight: "24px" }}
            >
              {message}
            </Text>
          </Section>

          {/* Email Info */}
          {email && (
            <Section style={{ marginTop: "20px" }}>
              <Text style={{ color: "#888", fontSize: "14px" }}>
                Account Email:{" "}
                <strong style={{ color: "#333" }}>{email}</strong>
              </Text>
            </Section>
          )}

          {/* Action Button */}
          {actionUrl && (
            <Section style={{ textAlign: "center", marginTop: "30px" }}>
              <Button
                href={actionUrl}
                style={{
                  backgroundColor: "#007bff",
                  color: "#ffffff",
                  padding: "12px 30px",
                  borderRadius: "5px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  display: "inline-block",
                }}
              >
                {actionText}
              </Button>
            </Section>
          )}

          <Hr style={{ borderColor: "#e0e0e0", margin: "30px 0" }} />

          {/* Footer */}
          <Section>
            <Text
              style={{ color: "#888", fontSize: "14px", lineHeight: "20px" }}
            >
              {footerText}
            </Text>
            <Text
              style={{ color: "#aaa", fontSize: "12px", marginTop: "20px" }}
            >
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
